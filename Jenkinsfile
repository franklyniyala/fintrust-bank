pipeline {
    agent any

    environment {
        DOCKERHUB_USERNAME = "ekenefranklyn"
        BACKEND_IMAGE = "${DOCKERHUB_USERNAME}/fintrust-backend"
        FRONTEND_IMAGE = "${DOCKERHUB_USERNAME}/fintrust-frontend"

        IMAGE_TAG = "${BUILD_NUMBER}"

        K8s_DIR = "K8s"
        MONITORING_DIR = "monitoring"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main', 
                credentialsId: 'GITHUB_LOGIN',
                url: 'https://github.com/franklyniyala/fintrust-bank.git'
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir('backend') {
                    sh 'npm install'
                }
            }
        }

        stage('Backend Unit Test') {
            steps {
                dir('backend') {
                    sh 'npm test'
                }
            }
        }

        stage ('Install Frontend Dependencies') {
            steps {
                dir ('frontend') {
                    sh 'npm install'
                }
            }
        }

        stage('Frontend Unit Test') {
            steps {
                dir('frontend') {
                    sh 'npm test'
                }
            }
        }

        stage('SonarQube Scan') {
            steps {
                withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
                    sh '''
                    docker run --rm \
                    -e SONAR_TOKEN=$SONAR_TOKEN \
                    -v $(pwd):/usr/src \
                    sonarsource/sonar-scanner-cli \
                    -Dsonar.projectKey=frank-org_fintrust \
                    -Dsonar.organization=frank-org \
                    -Dsonar.sources=. \
                    -Dsonar.host.url=https://sonarcloud.io \
                    '''
                }
            }
        }

        stage('SonarQube Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                dir('backend') {
                    sh '''
                    docker build \
                    -t ${BACKEND_IMAGE}:${IMAGE_TAG} \
                    -t ${BACKEND_IMAGE}:latest .
                    '''
                }
            }   
        }

        stage('Build Frontend Image') {
            steps {
                dir('frontend') {
                    sh '''
                    docker build \
                    -t ${FRONTEND_IMAGE}:${IMAGE_TAG} \
                    -t ${FRONTEND_IMAGE}:latest .
                    '''
                }
            }
        }

        stage('Trivy Security Scan') {
            steps {
                sh '''
                trivy image --exit-code 1 --severity HIGH,CRITICAL ${BACKEND_IMAGE}:latest
                trivy image --exit-code 1 --severity HIGH,CRITICAL ${FRONTEND_IMAGE}:latest
                '''
            }
        }

        stage('Push Images to DockerHub')  {
            steps {
                withCredentials([usernamePassword(credentialsId: 'DOCKER_LOGIN', usernameVariable: 'DOCKER_LOGIN', passwordVariable: 'DOCKER_PASSWORD')]) {
                    sh 'docker login -u $DOCKER_LOGIN -p $DOCKER_PASSWORD'
                    sh 'docker tag ${BACKEND_IMAGE}:latest ${DOCKER_USERNAME}/${BACKEND_IMAGE}:latest'
                    sh 'docker tag ${FRONTEND_IMAGE}:latest ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:latest'
                    sh 'docker push ${DOCKER_USERNAME}/${BACKEND_IMAGE}:latest'
                    sh 'docker push ${DOCKER_USERNAME}/${FRONTEND_IMAGE}:latest'
                }
            }
        } 

        stage('Deploy Monitoring') {
            steps {
                withCredentials([file(credentialsId: 'KUBECONFIG', variable: 'KUBECONFIG')]) {
                    sh '''
                    export KUBECONFIG=$KUBECONFIG
                    kubectl apply -f monitoring/monitoring/namespace.yml
                    kubectl apply -f monitoring/node-exporter/
                    kubectl apply -f monitoring/prometheus/
                    kubectl apply -f monitoring/grafana/
                    kubectl apply -f monitoring/postgres-exporter/
                    '''
                }
            }
        }

        stage('Deploy Application to Kubernetes') {
            steps {
                withCredentials([file(credentialsId: 'KUBECONFIG', variable: 'KUBECONFIG')]) {
                    sh '''
                    export KUBECONFIG=$KUBECONFIG
                    kubectl apply -f K8s/secrets/
                    kubectl apply -f K8s/configmaps/
                    kubectl apply -f K8s/deployments/
                    kubectl apply -f K8s/services/
                    kubectl apply -f K8s/ingress/
                    kubectl apply -f K8s/storage/
                    '''
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                withcredentials([file(credentialsId: 'KUBECONFIG', variable: 'KUBECONFIG')]) {
                    sh '''
                    export KUBECONFIG=$KUBECONFIG
                    kubectl rollout status deployment/postgres-db
                    kubectl rollout status deployment/fintrust-backend
                    kubectl rollout status deployment/fintrust-frontend
                    kubectl rollout status deployment/prometheus -n monitoring
                    kubectl rollout status deployment/grafana -n monitoring
                    kubectl rollout status deployment/postgres-exporter -n monitoring
                    '''
                }
            }
        }
    }

    post {
        success {
            echo ' ✅ Unit test and SonarQube scan completed successfully.'
            echo ' ✅ Docker images built and pushed to DockerHub successfully.'
            echo ' ✅ Application deployed to kubernetes successfully.'
        }
        failure {
            echo ' ❌ Pipeline failed. Please check the logs for details.'
        }
    }
}
