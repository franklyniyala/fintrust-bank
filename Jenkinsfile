pipeline {
    agent any

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main', 
                credentialsId: 'GITHUB_LOGIN',
                url: 'https://github.com/franklyniyala/fintrust-bank.git'
            }
        }

        stage('Backend Unit Test') {
            steps {
                dir('backend') {
                    sh 'npm install'
                    sh 'npm test'
                }
            }
        }

        stage ('Frontend Unit Test') {
            steps {
                dir ('frontend') {
                    sh 'npm install'
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

        stage('Build Backend Image') {
            steps {
                dir('backend') {
                    sh 'docker build -t fintrust-backend:latest .'
                }
            }   
        }

        stage('Build Frontend Image') {
            steps {
                dir('frontend') {
                    sh 'docker build -t fintrust-frontend:latest .'
                }
            }
        }

        stage('Push Images to DockerHub')  {
            steps {
                withCredentials([usernamePassword(credentialsId: 'DOCKER_LOGIN', usernameVariable: 'DOCKER_LOGIN', passwordVariable: 'DOCKER_PASSWORD')]) {
                    sh 'docker login -u $DOCKER_LOGIN -p $DOCKER_PASSWORD'
                    sh 'docker tag fintrust-backend:latest ekenefranklyn/fintrust-backend:latest'
                    sh 'docker tag fintrust-frontend:latest ekenefranklyn/fintrust-frontend:latest'
                    sh 'docker push ekenefranklyn/fintrust-backend:latest'
                    sh 'docker push ekenefranklyn/fintrust-frontend:latest'
                }
            }
        } 

        stage('Deploy Application to Kubernetes') {
            steps {
                withCredentials([file(credentialsId: 'KUBECONFIG', variable: 'KUBECONFIG')]) {
                    sh 'export KUBECONFIG=$KUBECONFIG'
                    sh 'kubectl apply -f K8s/'  
                    sh 'kubectl rollout status deployment/fintrust-backend'
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
